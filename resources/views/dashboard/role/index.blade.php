@extends('layouts.dashboard')

@section('content')
    <table class="table table-hover">
        <thead>
        <th class="numberlist">№</th>
        <th>Название</th>
        <th>Описание</th>
        <th>Привелегии</th>
        <th>Редактировать</th>
        </thead>
        <tbody>
        <?php $i = 0?>
            @foreach($roles as $role)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $role->name }}</td>
                    <td>{{ $role->label }}</td>
                    <td>{{ $role->getPermissionsAsString() }}</td>
                    <td><a href="{{ route('edit_role', $role->id) }}">Редактировать</a></td>
                </tr>
            @endforeach
        </tbody>
    </table>


@endsection