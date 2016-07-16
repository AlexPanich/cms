@extends('layouts.dashboard')

@section('page_title')
    Меню
@endsection

@section('content_title')
    Все меню
@endsection

@section('content')
    <?php $i = ($menus->currentPage() - 1) * 10 + 1 ?>
    <table class="table">
        <thead>
            <th>№</th>
                <th>Название меню</th>
                <th>Действия</th>
        </thead>
        <tbody>
        @foreach($menus as $item)
            <tr>
                <td>{{ $i++ }}</td>
                <td><a href="{{ route('edit_menu', $item->id) }}">{{ $item->title }}</a></td>
                <td>
                    <a class="btn btn-default btn-sm" href="{{ route('sort_menu', $item->id) }}">Сортировать</a>
                    <a class="btn btn-danger btn-sm" href="{{ route('delete_menu', $item->id) }}">Удалить</a>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $menus->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_menu') }}">Создать меню</a></p>
@endsection