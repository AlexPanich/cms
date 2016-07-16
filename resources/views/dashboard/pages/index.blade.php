@extends('layouts.dashboard')

@section('page_title')
    Страницы
@endsection

@section('content_title')
    Все страницы - Список
@endsection()

@section('content')
    <?php $i = ($pages->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
            <th>№</th>
            <th>Заголовок</th>
            <th>Просмотреть</th>
            <th>Редактировать</th>
            <th>Удалить</th>
            <th>Статус</th>
        </thead>
        <tbody>
            @foreach($pages as $page)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $page->title }}</td>
                    <td><a href="{{ route('url', $page->full_url) }}" target="_blank">Просмотреть</a></td>
                    <td><a href="{{ route('edit_page', $page->id) }}">Редактировать</a></td>
                    <td><a href="{{ route('delete_page', $page->id) }}">Удалить</a></td>
                    <td>{{ $page->is_show ? 'Опубликована' : 'Не опубликована' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $pages->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_page') }}">Создать страницу</a></p>
    <a href="{{ route('all_pages_tree') }}">Перейти к дереву страниц</a>
@endsection